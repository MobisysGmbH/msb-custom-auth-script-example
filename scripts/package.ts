(async function makePackage() {
  const fs = require('fs-extra');
  const path = require('node:path');

  const mainDir = path.resolve(__dirname, '..');
  const distDir = path.join(mainDir, 'dist');
  const srcDir = path.join(mainDir, 'src');
  const privateKeyPath = path.join(mainDir, 'developer_private.jwk');
  const publicKeyPath = path.join(mainDir, 'developer_public.jwk');
  const scriptJSPath = path.join(distDir, 'script.js');
  const settingsDescriptorTSPath = path.join(
    srcDir,
    'settings-descriptor',
    'settings-descriptor.ts',
  );

  const descriptor = require(settingsDescriptorTSPath).descriptor;
  const subtle = crypto.subtle;
  const projectMetadata = JSON.parse(
    await fs.readFile(path.join(mainDir, 'package.json'), 'utf8'),
  );

  let privateKey;

  // (opt) create developer key
  if (!(await fs.exists(privateKeyPath))) {
    const kp = await subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-384' },
      true,
      ['sign', 'verify'],
    );
    privateKey = kp.privateKey;

    const exportedPrivateKey = await subtle.exportKey('jwk', privateKey);
    const exportedPublicKey = await subtle.exportKey('jwk', kp.publicKey);

    await fs.writeFile(
      publicKeyPath,
      JSON.stringify(exportedPublicKey, null, 2),
      'utf8',
    );
    await fs.writeFile(
      privateKeyPath,
      JSON.stringify(exportedPrivateKey, null, 2),
      'utf8',
    );
  } else {
    const privateJWK = await fs.readFile(privateKeyPath, 'utf8');
    const parsedJWK = JSON.parse(privateJWK);
    privateKey = await crypto.subtle.importKey(
      'jwk',
      parsedJWK,
      { name: 'ECDSA', namedCurve: 'P-384' },
      false,
      ['sign'],
    );
  }

  const scriptFileContent = {
    script: await fs.readFile(scriptJSPath, 'utf-8'),
    scriptSettingsDescriptor: descriptor,
  };

  await fs.writeFile(
    `./dist/${projectMetadata.name}.msbcustomauthscript`,
    JSON.stringify(scriptFileContent),
  );
  const scriptFileBuffer = await fs.readFile(
    `./dist/${projectMetadata.name}.msbcustomauthscript`,
  );

  // calculate signature
  const signature = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-384' },
    privateKey,
    scriptFileBuffer,
  );
  const signatureBuffer = Buffer.from(signature);

  const publicKey = await fs.readFile(publicKeyPath, 'utf8');
  const parsedPublicKey = JSON.parse(publicKey);

  // create metadata
  const metadata = {
    name: projectMetadata.name,
    version: projectMetadata.version,
    signature: signatureBuffer.toString('base64'),
    publicKey: parsedPublicKey,
  };

  // write metadata
  await fs.writeFile(
    path.join(distDir, `${projectMetadata.name}.msbcustomauthmetadata`),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );
})();
